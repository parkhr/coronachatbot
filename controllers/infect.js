const express = require('express');
const request = require('request');
const moment = require('moment');
const router = express.Router();

const InfectOnedaySchema = require('../models/infect');

/**
 * 오늘 확진자 현황 조회
 */
router.get('/today', (req, res) => {
  var today = moment(new Date());
  console.log(today);
  today = today
    .tz('Asia/Seoul')
    .format()
    .split('T')[0];
  console.log(today);

  InfectOnedaySchema.find({ create_date: { $regex: '.*' + today + '.*' } })
    .then(todayData => {
      InfectOnedaySchema.find()
        .then(totalData => {
          // 확진자 데이터 최근 순서로 정렬
          if (totalData.length > 1) {
            totalData.sort(function(a, b) {
              return a.seq < b.seq ? 1 : a.seq > b.seq ? -1 : 0;
            });
          }

          // 오늘 확진자 데이터가 있다면
          if (todayData.length >= 1) {
            for (let i = 0; i < totalData.length; i++) {
              // 전날 데이터라면 오늘과 비교
              if (totalData[i].seq != todayData[0].seq) {
                decideCount =
                  todayData[0].decide_count - totalData[i].decide_count; // 오늘 확진자 수
                deathCount =
                  todayData[0].death_count - totalData[i].death_count; // 오늘 사망자 수
                return res.json(
                  responseTodayDecideForKakao(
                    todayData[0].decide_count,
                    decideCount,
                    todayData[0].death_count,
                    deathCount,
                  ),
                );
              }
            }

            // 45번째줄 if문에 걸리지 않을때를 처리해야함.
          } else return res.json(responseTodayDecideNoDataForKakao());
        })
        .catch(err => {
          return res.json(responseTodayDecideNoDataForKakao());
        });
    })
    .catch(err => {
      return res.json(responseTodayDecideNoDataForKakao());
    });
});

/**
 * 확진자 데이터 insert
 */
router.post('/', (req, res) => {
  let key = unescape(process.env.PUBLIC_SERVICE_KEY);

  var today = moment(new Date());
  today = today
    .tz('Asia/Seoul')
    .format()
    .split('T')[0];

  today = today.split('-');
  today = today[0] + today[1] + today[2];

  const options = {
    uri:
      'http://openapi.data.go.kr/openapi/service/rest/Covid19/getCovid19InfStateJson',
    qs: {
      serviceKey: key,
      pageNo: '1',
      numOfRows: '10',
      startCreateDt: today,
      endCreateDt: today,
      _type: 'json',
    },
  };

  request(options, function(error, response, body) {
    const obj = JSON.parse(body);

    if (obj.response.body.items == '') {
      check = false;
      return;
    }

    if (typeof obj.response.body.items.item.length == 'number') {
      // 데이터 여러개
      let result = obj.response.body.items.item;

      result.forEach(function(item, index, arr) {
        InfectOnedaySchema.findOne({ seq: item.seq }).then(data => {
          if (data == null) {
            let infectOneday = setInfectOnedayData(item);

            infectOneday.save().then(data => {});
          }
        });
      });
    } else {
      // 데이터 1개
      // console.log("1개");
      InfectOnedaySchema.findOne({
        seq: obj.response.body.items.item.seq,
      }).then(data => {
        if (data == null) {
          let infectOneday = setInfectOnedayData(obj.response.body.items.item);

          infectOneday.save().then(data => {});
        }
      });
    }
  });

  res.json(responseRefreshDecideDataForKakao());
});

// set infectOnedayData
function setInfectOnedayData(item) {
  return new InfectOnedaySchema({
    clear_count: item.clearCnt,
    create_date: item.createDt,
    death_count: item.deathCnt,
    decide_count: item.decideCnt,
    exam_count: item.examCnt,
    care_count: item.careCnt, // 치료중 환자 수
    result_neg_count: item.resutlNegCnt, // 결과 음성 수
    acc_exam_count: item.accExamCnt, // 누적 검사 수
    acc_exam_complete_count: item.accExamCompCnt, // 누적 검사 완료 수
    seq: item.seq, // 구분자
  });
}

// =========== kakao response json 형식 ===========

function responseTodayDecideForKakao(
  totalDecideCount,
  todayDecideCount,
  totalDeathCount,
  todayDeathCount,
) {
  return {
    version: '2.0',
    template: {
      outputs: [
        {
          basicCard: {
            title: '금일 코로나 조회',
            description:
              '총 확진자 : ' +
              totalDecideCount +
              '\n' +
              '총 사망자 : ' +
              totalDeathCount +
              '\n' +
              '오늘 확진자 : ' +
              todayDecideCount +
              '\n' +
              '오늘 사망자 : ' +
              todayDeathCount,
          },
        },
      ],
    },
  };
}

function responseTodayDecideNoDataForKakao() {
  return {
    version: '2.0',
    template: {
      outputs: [
        {
          basicCard: {
            title: '금일 코로나 조회',
            description: '데이터가 없어요.',
          },
        },
      ],
    },
  };
}

function responseRefreshDecideDataForKakao() {
  let str = '갱신을 완료했어요.';

  return {
    version: '2.0',
    template: {
      outputs: [
        {
          basicCard: {
            title: str,
          },
        },
      ],
    },
  };
}

module.exports = router;
