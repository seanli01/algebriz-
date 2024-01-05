import Image from "next/image";
import styles from "./DeleteBtn.module.css";
import iconDelete from "@/public/trash_icon.svg";

export default function DeleteBtn({ itemIdx, text, onClick }) {
  return (
    <div className={styles.cont} onClick={() => onClick(itemIdx)}>
      <div className={styles.icon}>
        <Image
          src={iconDelete}
          alt="Delete button"
        />
        {text ? <div className={styles.text}>{text}</div> : <></>}
      </div>
    </div>
  )
}