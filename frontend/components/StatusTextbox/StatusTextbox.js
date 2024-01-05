import styles from "./StatusTextbox.module.css";

export default function StatusTextbox({ msg, color, isCentered }) {
  let className = color === "green" 
    ? `${styles.text} ${styles.succ}` 
    : color === "yellow"
    ? `${styles.text} ${styles.warn}`
    : `${styles.text} ${styles.err}`;
  if(isCentered === true) className += ` ${styles.center}`;
  return (
    <p className={className}>
      { msg ? msg : ""}
    </p>
  );
}