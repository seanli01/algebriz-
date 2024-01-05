import styles from "./AccountBtn.module.css";

export default function AccountBtn({ btnText, onClick }) {
  return <div className={styles.btn} onClick={onClick}>{btnText}</div>
}