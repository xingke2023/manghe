const publishApi = require('../../../api/publish')
const QUESTIONS = require('./questions')

const app = getApp()

Page({
  data: {
    step: 'intro',
    current: 0,
    total: QUESTIONS.length,
    question: QUESTIONS[0],
    /** 当前题选中的选项 key */
    picked: '',
    /** {q1: 'A', ...} */
    answers: {},
    isLast: false,
    progressPercent: 0,
    submitting: false,
  },

  onStart: function () {
    this.setData({ step: 'quiz' })
    this.showQuestion(0)
  },

  showQuestion: function (index) {
    const question = QUESTIONS[index]
    this.setData({
      current: index,
      question: question,
      picked: this.data.answers[question.id] || '',
      isLast: index === QUESTIONS.length - 1,
      progressPercent: Math.round(((index + 1) / QUESTIONS.length) * 100),
    })
  },

  onPick: function (e) {
    this.setData({ picked: e.currentTarget.dataset.key })
  },

  onNext: function () {
    if (!this.data.picked || this.data.submitting) return

    const answers = Object.assign({}, this.data.answers)
    answers[this.data.question.id] = this.data.picked
    this.setData({ answers: answers })

    if (!this.data.isLast) {
      this.showQuestion(this.data.current + 1)
      return
    }
    this.submit(answers)
  },

  submit: function (answers) {
    const self = this
    this.setData({ submitting: true })
    publishApi
      .submitValueTest(answers, app.getToken())
      .then(function (res) {
        // status 1 自动通过，2 待人工审核
        const status = res.status === 1 ? 'pass' : 'pending'
        wx.redirectTo({
          url: '/pages/publish/value-test-result/index?status=' + status,
        })
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '提交失败', icon: 'none' })
        self.setData({ submitting: false })
      })
  },
})
