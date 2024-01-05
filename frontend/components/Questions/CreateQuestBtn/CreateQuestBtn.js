import StatusTextbox from "@/components/StatusTextbox/StatusTextbox";
import styles from "./CreateQuestBtn.module.css";

export default function CreateQuestBtn({ msg, onClick, isSuccess }) {
  const color = isSuccess === true ? "green" : "red";

  return (
    <div className={styles.cont}>
      <button className={styles.button} type="submit" onClick={onClick}>Create</button>
      <StatusTextbox msg={msg} color={color} isCentered={true}/>
    </div>
  );
}