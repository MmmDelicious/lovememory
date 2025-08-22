import React, { useState } from 'react';
import Button from '../Button/Button';
import styles from './Widget.module.css';
import { FaUsers } from 'react-icons/fa';
const PairingWidget = ({ pairing, isPairingLoading, partner, sendRequest, deletePairing }) => {
  const [partnerEmail, setPartnerEmail] = useState('');
  const handleSendRequest = async (e) => {
    e.preventDefault();
    await sendRequest(partnerEmail);
    setPartnerEmail('');
  };
  return (
    <div className={`${styles.widget} ${styles.pairWidget}`}>
      <div className={styles.widgetIconWrapper}><FaUsers /></div>
      <div className={styles.widgetContent}>
        <h4 className={styles.widgetTitle}>Управление парой</h4>
        <div className={styles.widgetBody}>
          {isPairingLoading ? <p>Загрузка...</p> : partner ? (
            <>
              <p>Вы в паре с <strong>{partner.first_name || partner.last_name || 'Пользователь'}</strong>.</p>
              <Button onClick={() => deletePairing(pairing.id)} type="secondary" style={{ width: '100%' }}>Разорвать связь</Button>
            </>
          ) : (
            <form onSubmit={handleSendRequest}>
              <p>Отправьте приглашение, чтобы начать отношения.</p>
              <input type="email" value={partnerEmail} onChange={(e) => setPartnerEmail(e.target.value)} placeholder="Email партнёра" required className={styles.input} />
              <Button type="primary" submit style={{ width: '100%' }}>Отправить</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
export default PairingWidget;
