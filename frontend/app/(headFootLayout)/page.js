"use client";
import styles from './page.module.css';
import Image from 'next/image';
import logo from "@/public/logo.svg";
import bg from "@/public/bg.svg";
import { useUserContext } from './layout';
import JoinSessionForm from '@/components/Multiplayer/JoinSessionForm/JoinSessionForm';
import { useEffect } from 'react';
import { useSocket } from '@/components/Multiplayer/SocketContext';
import { useRouter } from 'next/navigation';

export default function Home() {
  const user = useUserContext();
  const {socket} = useSocket();
  const router = useRouter();

  useEffect(() => {
    if (socket) {
      const handleQuizStarted = ({ quizId, creatorId }) => {
        console.log(`Quiz ${quizId} started by ${creatorId}`);
        router.push(`/quizzes/${quizId}`);
      }

      socket.on('quiz started', handleQuizStarted);

      return () => {
        socket.off('quiz started', handleQuizStarted);
      }
    }
  }, [socket]);

  return (
    <main className={styles.main}>
      <div className={styles.center_cont}>
        <div className={styles.inner_cont}>
          <Image
            src={logo}
            alt='Algebriz'
          />
        </div>
        <JoinSessionForm userId={user}/>
      </div>
      <div className={styles.bg_cont}>
        <Image
          src={bg}
          alt='Background'
          fill
        />
      </div>
    </main>
  )
}

