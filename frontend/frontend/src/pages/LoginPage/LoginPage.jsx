// filepath: src/pages/LoginPage/LoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';
import AuthCard from '../../components/common/AuthCard/AuthCard';
import AuthLogo from '../../components/common/AuthLogo/AuthLogo';
import AuthInput from '../../components/common/AuthInput/AuthInput';
import OrDivider from '../../components/common/OrDivider/OrDivider';
import SocialIcons from '../../components/common/SocialIcons/SocialIcons';
import RoundButton from '../../components/common/RoundButton/RoundButton';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function handleLogin() {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/home');
    }, 800);
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.cardContainer}>
        <AuthCard>
          <AuthLogo />
          <h2 className={styles.title}>Sign In</h2>
          <AuthInput
            label="Phone number or email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <AuthInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <OrDivider />
          <SocialIcons />
          <RoundButton onClick={handleLogin} isLoading={isLoading} />
        </AuthCard>
      </div>
    </div>
  );
}
