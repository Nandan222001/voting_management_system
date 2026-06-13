import logo from '../../logo/logo.png';

const AppLogo = ({ className = "w-12 h-12", size }) => {
  const style = size ? { width: size, height: size } : {};
  return (
    <img 
      src={logo} 
      alt="VBA Connect" 
      className={`block p-0 ${className}`} 
      style={style} 
    />
  );
};

export default AppLogo;
