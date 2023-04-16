'use strict'

const fs = require('node:fs').promises
const pdfParse = require('pdf-parse')

class Quiz {
  constructor (opts = {}) {
    this.score = 0
    this.questions = []
    this.userAnswers = []
    this.asked = 0

    this.questionPerMateria = opts.questionPerMateria || 10

    this.materia = {
      dirittoProcessualePenale: {
        da: 1, a: 1000
      },
      dirittoCivile: {
        da: 1001, a: 2000
      },
      dirittoCostituzionale: {
        da: 2001, a: 3000
      },
      dirittoAmministrativo: {
        da: 3001, a: 4000
      },
      dirittoPenale: {
        da: 4001, a: 5000
      }
    }

    this.totalQuestions = Object.keys(this.materia).length * this.questionPerMateria
  }

  addQuestion (question) {
    question.answers = question.answers.map((answer) => {
      const [letter, text] = answer.split(') ')
      return {
        text,
        letter,
        correct: letter === 'A'
      }
    })

    const number = question.text.match(/^\d+\. /)[0]
    question.id = parseInt(number.replace('.', ''))

    question.materia = Object.keys(this.materia).find((materia) => {
      const { da, a } = this.materia[materia]
      return question.id >= da && question.id <= a
    })

    this.questions.push(question)
  }

  registerAnswer (answer) {
    this.userAnswers.push(answer)
    this.asked++
    this.score += answer.answer === 'A' ? 1 : 0
  }

  getWrongAnswers () {
    return this.userAnswers.filter((answer) => {
      return answer.answer !== 'A'
    })
  }

  * nextQuestion () {
    const materias = Object.keys(this.materia)

    for (const materia of materias) {
      const { da, a } = this.materia[materia]
      const questions = this.questions.filter((question) => {
        return question.id >= da && question.id <= a
      })

      let counter = this.questionPerMateria

      while (counter--) {
        const random = Math.floor(Math.random() * questions.length) + 1
        const question = questions[random]
        yield question
      }
    }
  }

  static async build ({
    pdfPath,
    questionPerMateria
  }) {
    const readFileSync = await fs.readFile(pdfPath)
    const pdfExtract = await pdfParse(readFileSync)

    const lines = pdfExtract.text.split('\n')

    const quiz = new Quiz({
      questionPerMateria
    })

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const isQuestionStart = line.match(/^\d+\. /)
      if (!isQuestionStart) {
        continue
      }

      const question = {
        text: line,
        answers: []
      }

      // get the question

      let isAnswerStart = false
      while (!isAnswerStart) {
        const line = lines[++i]
        isAnswerStart = line.match(/^[A-E]\)/)
        if (!isAnswerStart) {
          question.text += line
        }
      }

      // get the answers
      let answer = lines[i]
      let nextQuestion = false
      while (!nextQuestion) {
        const line = lines[++i]
        if (!line || line.match(/^\d+ di 468/)) {
          break
        }

        isAnswerStart = line.match(/^[A-E]\)/)
        nextQuestion = line.match(/^\d+\. /)

        if (isAnswerStart) {
          question.answers.push(answer)
          answer = line
        } else if (!nextQuestion) {
          answer += line
        }
      }

      question.answers.push(answer)
      quiz.addQuestion(question)
      i--
    }

    return quiz
  }
}

module.exports = Quiz
