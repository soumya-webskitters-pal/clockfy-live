export default function Button({ children, className = '', variant = 'default', ...props }) {
  return <button className={`button ${variant} ${className}`} {...props}>{children}</button>;
}
