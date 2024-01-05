import styles from '../page.module.css'
import QuizManagement from "@/components/Quiz/QuizManagement";

export default function Manage() {
  return (
    <div className={styles.main}>
      <QuizManagement isBrowsing={false}/>
    </div>
  )
}