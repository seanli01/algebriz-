import { useState } from "react";
import styles from "./LoginForm.module.css";
import { signin, signup } from "@/api/api.mjs";
import StatusTextbox from "../StatusTextbox/StatusTextbox";
import useOutsideClick from "@/utils/useOutsideClick";
import AccountBtn from "../AccountBtn/AccountBtn";
import { useSocket } from "../Multiplayer/SocketContext";

export default function LoginForm(props) {
  const [err, setErr] = useState(null);
  const [formVis, setFormVis] = useState(false);
  const {onConnect} = useSocket();

  const onSubmit = (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;
    const buttonName = e.nativeEvent.submitter.name;
    e.target.password.value = "";
    if(buttonName === "signin") {
      signin(username, password)
        .then((res) => {
          if(res.status === 500) return setErr("Server error, please try again later");
          if(!res.ok) return setErr("Incorrect username or password");
          return res.json().then(props.loginSuccFunc);
        }).catch((err) => {
          console.log(err);
          return setErr("Server error");
        });
    }
    if(buttonName === "signup") 
      signup(username, password)
        .then((res) => {
          if(res.status === 409) return setErr("Username already taken");
          if(res.status === 500) return setErr("Server error, please try again later");
          if(!res.ok) return setErr("Something's amiss, please try again later");
          return res.json().then(props.loginSuccFunc);
        }).catch((err) => {
          console.log(err);
          return setErr("Server error");
        });
  }

  const onOutsideClick = () => {
    setFormVis(false);
  }

  const ref = useOutsideClick(onOutsideClick);

  return (
    <div className={styles.cont} ref={ref}>
      <AccountBtn 
        btnText={formVis ? "Close" : "Sign In"} 
        onClick={() => setFormVis(!formVis)}
      />
      {formVis ? 
        <form className={styles.form} onSubmit={onSubmit}>
          <input 
            type="text"
            name="username"
            className={ err ? `${styles.form__textbox} ${styles.err}` : styles.form__textbox }
            placeholder="Username"
            onChange={() => setErr(null)}
            required
          />
          <StatusTextbox msg={err}/>
          <input
            type="password"
            name="password"
            className={styles.form__textbox}
            placeholder="Password"
            onChange={() => setErr(null)}
            required
          />
          <button name="signin" className={`${styles.form__btn} ${styles.form__signin}`} type="submit">Sign In</button>
          or
          <button name="signup" className={`${styles.form__btn} ${styles.form__signup}`} type="submit">Sign Up</button>
        </form>
        : <></>}
    </div>
  )
}