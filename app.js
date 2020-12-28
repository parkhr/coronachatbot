const express = require('express');
const mongoose = require('./models/connect');
const request = require('request');
require('dotenv').config();
const app = express();
const port = 3000;

const InfectOnedaySchema = require('./models/infect');

// db connect
mongoose();

/**
 * 오늘 확진자 현황 조회
 */
app.post('/infect/today', (req, res) => {
    let today = new Date().toISOString().split('T')[0];
    InfectOnedaySchema.find({create_date: {$regex: '.*' + today + '.*'}}).then((result) => {
        console.log(result);
        if(result.length > 0){
            let data = {
                version: "2.0",
                template: {
                  outputs: [
                    {
                      basicCard: {
                        title: "금일 코로나 조회",
                        description: "총 확진자 : " + result[0].decide_count + "\n" + "총 사망자 : " + result[0].death_count
                      }
                    }
                  ]
                }
              }
            // return res.json(result);
            return res.json(data);
        }
        else return res.status(404).send("데이터가 없습니다.");
    });
})

/**
 * 전체 확진자 현황 조회
 */
app.post('/infects', (req, res) => {
    InfectOnedaySchema.find(function(err, arr){
        console.log(arr);
        if(arr.length > 0) return res.json(arr);
        return res.status(404).send("데이터가 없습니다.");
    });
});

/**
 * 확진자 데이터 insert
 */
app.post('/infect', (req, res) => {
    let key = unescape(process.env.PUBLIC_SERVICE_KEY);
    let today = new Date().toISOString().split('T')[0];
    console.log(today)
    today = today.split("-");
    today = today[0]+today[1]+today[2];
    console.log(today);

    const options = {
        uri: "http://openapi.data.go.kr/openapi/service/rest/Covid19/getCovid19InfStateJson",
        qs: {
            serviceKey: key,
            pageNo: "1",
            numOfRows: "10",
            startCreateDt: today,
            endCreateDt: today,
            _type: "json"
        }
    }

    request(options, function(error, res, body){
        const obj = JSON.parse(body);
        console.log(res.statusCode);
        console.log(obj.response.body);

        if(obj.response.body.items == ''){
            console.log('데이터 없음 !!!!!!!!!');
            return ;
        }

        if(typeof(obj.response.body.items.item.length) == "number"){
            // 데이터 여러개
            console.log("여러개");
            let result = obj.response.body.items.item;

            result.forEach(function(item, index, arr){
                InfectOnedaySchema.findOne({seq: item.seq}).then((data) => {
                    if(data == null){
                        let infectOneday = setInfectOnedayData(item);

                        infectOneday.save().then((data) => {
                            console.log(data);
                        });
                    }
                });
            })
        }else{
            // 데이터 1개
            console.log("1개");
            InfectOnedaySchema.findOne({seq: obj.response.body.items.item.seq}).then((data) => {
                if(data == null){
                    let infectOneday = setInfectOnedayData(obj.response.body.items.item);

                    infectOneday.save().then((data) => {
                        console.log(data);
                    });
                }
            });
        }
    });

    res.send('Hello World!');
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
})

// set infectOnedayData
function setInfectOnedayData(item){
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
        seq: item.seq // 구분자
    });
}