export default function FormField({ label, error, icon: Icon, ...inputProps }) {
  return (
    <label className="form-field">
      <span className="form-field__label">{label}</span>
      <span className={`form-field__control ${error ? 'is-invalid' : ''}`}>
        {Icon && <Icon size={18} />}
        <input {...inputProps} />
      </span>
      {error && <span className="form-field__error">{error}</span>}
    </label>
  );
}
