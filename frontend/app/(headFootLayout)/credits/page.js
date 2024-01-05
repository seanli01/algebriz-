import styles from '../page.module.css'

export default function Credits() {
  return (
    <div className={styles.main}>
      <h1>Credits</h1>
      <h2>Icons and Buttons</h2>
      <ul>
        <li>
          <a href="https://www.flaticon.com/free-icons/delete" title="delete icons">Delete icons created by Kiranshastry - Flaticon</a>
        </li>
        <li>
          <a href="https://www.flaticon.com/free-icons/edit" title="edit icons">Edit icons created by Kiranshastry - Flaticon</a>
        </li>
        <li>
          <a href="https://www.flaticon.com/free-icons/video" title="video icons">Video icons created by Freepik - Flaticon</a>
        </li>
        <li>
          Icons above were recreated by Auric in Inkscape. All other icons, the logo, and background image were made by Auric in Inkscape.
        </li>
      </ul>
      <h2>HTML, CSS and Javascript code</h2>
      <ul>
        <li>
          <a href="http://stackoverflow.com/">Stackoverflow</a>
        </li>
      </ul>
    </div>
  )
}