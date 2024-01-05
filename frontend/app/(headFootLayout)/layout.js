"use client";
import { useEffect, useState, createContext, useContext } from "react";
import Link from "next/link";
import styles from './page.module.css';
import Image from "next/image";
import { getUsername, signout } from "@/api/api.mjs";
import LoginForm from "@/components/LoginForm/LoginForm";
import imageLogoSmall from "@/public/algebriz_logo_tiny.svg";
import { usePathname, useRouter } from "next/navigation";
import HeaderLink from "@/components/HeaderLink/HeaderLink";
import AccountBtn from "@/components/AccountBtn/AccountBtn";
import { useSocket } from "@/components/Multiplayer/SocketContext";

const UserContext = createContext();
export const useUserContext = () => useContext(UserContext);

export default function HeadFootLayout({ children }) {
  const [user, setUser] = useState();   // user is a string for their username
  const {onConnect, onDisconnect, onLeaveQuiz} = useSocket();
  const path = usePathname();
  const router = useRouter();

  useEffect(() => {
    setUser(getUsername());
  }, []);

  useEffect(() => {
    if (user) onConnect();
  }, [user]);

  const handleSignout = () => {
    signout().then(() => {
      document.cookie = "username=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;"; // remove username cookie
      router.replace("/");
      setUser(null);
      onDisconnect();
    });
  }

  return (
    <UserContext.Provider value={user}>
      <header className={styles.header}>
        <div className={styles.header__left}>
          <Link href="/">
            <Image
              src={imageLogoSmall}
              alt="Algebriz logo"
              className={styles.header__logo}
            />
          </Link>
          <HeaderLink currentPath={path} targetPath={"/"}>
            Play
          </HeaderLink>
          { user ?
            <HeaderLink currentPath={path} targetPath={"/quizzes"} onClick={onLeaveQuiz}>
              Browse Quizzes
            </HeaderLink>
            :
            <></>
          }
          <HeaderLink currentPath={path} targetPath={"/credits"} onClick={onLeaveQuiz}>
            Credits
          </HeaderLink>
        </div>
        { user ? 
          <div className={styles.header__acc_cont}>
            <HeaderLink currentPath={path} targetPath={"/manage"} onClick={onLeaveQuiz}>
              My Quizzes
            </HeaderLink>
            <div className={styles.header__acc_text}>Welcome, {user}</div>
            <AccountBtn btnText={"Sign Out"} onClick={handleSignout}/>
          </div>
          :
          <LoginForm loginSuccFunc={username => setUser(username)}/>
        }
      </header>
      {children}
    </UserContext.Provider>
  )
}