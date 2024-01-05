import QuizManagement from '@/components/Quiz/QuizManagement'
import styles from '../page.module.css'

export default function Quizzes() {
  return (
    <main className={styles.main}>
      <QuizManagement isBrowsing={true}/>
    </main>
  )
}