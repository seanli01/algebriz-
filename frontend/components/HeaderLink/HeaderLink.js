import styles from "./HeaderLink.module.css";
import Link from "next/link";

export default function HeaderLink({ currentPath, targetPath, onClick, children }) {
  return (
    currentPath === targetPath ?
      <div className={`${styles.header__link} ${styles.current}`}>{children}</div>
    :
    <Link href={targetPath} className={`${styles.header__link} ${styles.clickable}`} onClick={onClick}>
      {children}
    </Link>
  )
}