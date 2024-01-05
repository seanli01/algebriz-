import styles from "./ConfirmPrompt.module.css";
import useOutsideClick from "@/utils/useOutsideClick";

export default function ConfirmPrompt({ title, subtitle, conText, rejText, onCon, onRej }) {  
  const ref = useOutsideClick(onRej);

  return (
    <div className={styles.bg}>
      <div ref={ref} className={styles.prompt}>
        <div className={styles.prompt__title_cont}>
          <div className={styles.prompt__title}>{title}</div>
        </div>
        <div className={styles.prompt__subtitle}>{subtitle}</div>
        <div className={styles.prompt__btn_cont}>
          <div onClick={onRej} className={`${styles.prompt__no_cont} ${styles.btn}`}>
            <div className={`${styles.prompt__no_text} ${styles.btn_text}`}>
              {rejText ? rejText : "No"}
            </div>
          </div>
          <div onClick={onCon} className={`${styles.prompt__yes_cont__red} ${styles.btn}`}>
            <div className={`${styles.prompt__yes_text__red} ${styles.btn_text}`}>
              {conText ? conText : "Yes"}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}