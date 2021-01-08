const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InfectOnedaySchema = new Schema({
  clear_count: Number, // 격리해제 수
  create_date: String, // 등록 날짜
  death_count: Number, // 사망자 수
  decide_count: Number, // 확진자 수
  exam_count: Number, // 검사 진행 수
  care_count: Number, // 치료중 환자 수
  result_neg_count: Number, // 결과 음성 수
  acc_exam_count: Number, // 누적 검사 수
  acc_exam_complete_count: Number, // 누적 검사 완료 수
  seq: Number, // 구분자
});

const infectOnedayData = mongoose.model('infectonedaydata', InfectOnedaySchema);
module.exports = infectOnedayData;
