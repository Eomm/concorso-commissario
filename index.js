'use strict'

const Quiz = require('./lib/Quiz')
const runQuiz = require('./lib/Showtime')

const config = {
  pdfPath: './banca-dati-11-aprile.pdf',
  questionPerMateria: 10
};

// IIFE
(async () => {
  const quiz = await Quiz.build(config)
  await runQuiz(quiz)
})()
