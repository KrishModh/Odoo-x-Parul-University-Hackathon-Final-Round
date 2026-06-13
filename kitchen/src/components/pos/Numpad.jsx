const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫'];

export default function Numpad() {
  return <div className="numpad">{keys.map((key) => <button key={key}>{key}</button>)}</div>;
}
