import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <Result
        status="404"
        title="404"
        subTitle="Lo sentimos, la página que buscas no existe o no tienes acceso."
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            Volver al Inicio
          </Button>
        }
      />
    </div>
  );
}
