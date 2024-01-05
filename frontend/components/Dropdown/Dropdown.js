"use client";
import { useState } from "react";
import styles from "./Dropdown.module.css";
import useOutsideClick from "@/utils/useOutsideClick";
import Image from "next/image";
import iconDownArrow from "@/public/down_arrow.svg";

export default function Dropdown({ list, onOptionClick, currentOpt }) {
  const [menuVis, setMenuVis] = useState(false);

  const onClick = (item) => {
    setMenuVis(false);
    return onOptionClick(item);
  }

  const onOutsideClick = () => {
    setMenuVis(false);
  }

  const ref = useOutsideClick(onOutsideClick);

  return (
    <div ref={ref} className={styles.dropdown}>
      <div className={styles.header} onClick={() => setMenuVis(!menuVis)}>
        <div className={styles.header__text}>{currentOpt}</div>
        <Image
          src={iconDownArrow}
          alt="Dropdown arrow"
          className={`${styles.header__arrow} ${menuVis ? styles.up : ""}`}
        />
      </div>
      <div className={menuVis ? styles.menu : ""}>
        { !menuVis ? <></> : 
            !list ? <p>No Items Available</p> : 
              list.map((item, idx) => <div 
                className={
                  idx === list.length - 1 ? 
                  `${styles.menu__items} ${styles.last}`
                  :
                  styles.menu__items
                } 
                key={idx} 
                onClick={() => onClick(item)}>{item}</div>) }
      </div>
    </div>
    
  )
}