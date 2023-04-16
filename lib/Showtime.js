'use strict'

const ms = require('ms')

async function runQuiz (quiz) {
  const inquirer = (await import('inquirer')).default

  const start = Date.now()

  for await (const question of quiz.nextQuestion()) {
    const { answer } = await askQuestion(question)

    quiz.registerAnswer({
      id: question.id,
      question,
      answer
    })

    console.log(`${quiz.asked} di ${quiz.totalQuestions} in ${ms(Date.now() - start, { long: true })}`)
  }

  console.log('Hai totalizzato', quiz.score, 'punti su', quiz.asked)
  console.log('Hai sbagliato', quiz.getWrongAnswers().length, 'domande')

  console.log('\n\n\tHai sbagliato le seguenti domande: ')
  const wrongAnswers = quiz.getWrongAnswers()
  for (const wrongAnswer of wrongAnswers) {
    console.log(wrongAnswer.question.text)
    console.log(`Avevi risposto: ${wrongAnswer.answer}`)
  }

  await confirmBeforeExit(inquirer)

  function askQuestion (question) {
    return inquirer.prompt([{
      name: 'answer',
      type: 'list',
      message: question.text,
      choices: arrayRandomOrder(question.answers).map((answer) => {
        return {
          name: answer.text,
          value: answer.letter
        }
      })
    }]
    )
  }
}

module.exports = runQuiz

function arrayRandomOrder (array) {
  return array.sort(() => Math.random() - 0.5)
}

async function confirmBeforeExit (inquirer) {
  const { exit } = await inquirer.prompt([{
    type: 'confirm',
    name: 'exit',
    message: 'Sei sicuro di voler uscire?',
    default: false
  }])

  if (!exit) {
    return confirmBeforeExit(inquirer)
  }
}
