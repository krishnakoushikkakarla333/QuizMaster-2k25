import React from 'react'
import TeacherHeader from './TeacherHeader'
import TeacherFooter from './TeacherFooter'
import CreateQuizForm from './CreateQuizForm'

const NewQuiz = () => {
  return (
    <div className='bg-gray-200'>
      <TeacherHeader />
      <div className='h-auto py-6'>
        <CreateQuizForm />
      </div>
      <TeacherFooter />
    </div>
  )
}

export default NewQuiz
