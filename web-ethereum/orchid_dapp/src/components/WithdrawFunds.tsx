import React, {FC, useContext, useRef, useState} from "react";
import {OrchidAPI} from "../api/orchid-api";
import {isEthAddress} from "../api/orchid-eth";
import {errorClass, parseFloatSafe, Visibility} from "../util/util";
import {TransactionStatus, TransactionProgress} from "./TransactionProgress";
import {SubmitButton} from "./SubmitButton";
import {Col, Container, Row} from "react-bootstrap";
import {S} from "../i18n/S";
import {EthAddress} from "../api/orchid-eth-types";
import {AccountContext, ApiContext, WalletContext, WalletProviderContext} from "../index";
import {LotFunds} from "../api/orchid-eth-token-types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BigInt = require("big-integer"); // Mobile Safari requires polyfill

export const WithdrawFunds: FC = () => {
  let txResult = useRef<TransactionProgress | null>(null);

  const [userEnteredWithdrawAmount, setUserEnteredWithdrawAmount] = useState<number | null>(null);
  const [withdrawAll, setWithdrawAll] = useState(false);
  const [sendToAddress, setSendToAddress] = useState<EthAddress | null>(null);
  const [amountError, setAmountError] = useState(true);
  const [addressError, setAddressError] = useState(true);
  const [tx, setTx] = useState(new TransactionStatus());
  const [editingWithdrawAmount, setEditingWithdrawAmount] = useState(false);

  let api = useContext(ApiContext)
  let wallet = useContext(WalletContext);
  let pot = useContext(AccountContext);
  let {fundsToken} = useContext(WalletProviderContext);

  async function submitWithdrawFunds() {
    const api = OrchidAPI.shared();
    const wallet = api.wallet.value;
    const signer = api.signer.value;

    if (!wallet
      || !signer
      || !api.eth
      || (userEnteredWithdrawAmount == null && !withdrawAll)
      || sendToAddress == null
      || !pot
      || !fundsToken
    ) {
      console.log("precondition error in withdraw");
      return;
    }
    setTx(TransactionStatus.running());

    if (txResult?.current) {
      txResult.current.scrollIntoView();
    }

    try {
      let txId: string;
      if (withdrawAll) {
        txId = await api.eth.orchidWithdrawFundsAndEscrow(pot, sendToAddress);
      } else {
        if (!userEnteredWithdrawAmount) {
          console.log("error no withdraw amount")
          return; // Shouldn't get here.
        }
        const withdrawFunds = fundsToken.fromNumber(userEnteredWithdrawAmount)
        txId = await api.eth.orchidWithdrawFunds(
          wallet.address, signer.address, sendToAddress, withdrawFunds, pot.balance);
      }
      await api.updateLotteryPot();
      await api.updateWallet();
      await api.updateSigners();
      setTx(TransactionStatus.result(txId, S.transactionComplete));
      api.updateTransactions().then();
    } catch (err) {
      setTx(TransactionStatus.error(`${S.transactionFailed}: ${err}`));
    }
  }

  ///
  /// Render
  ///

  const potBalance: LotFunds | undefined = pot?.balance
  let withdrawAmount: string | undefined = withdrawAll ?
    (potBalance ?? fundsToken?.zero)?.toFixedLocalized(4)
    : userEnteredWithdrawAmount?.toFixedLocalized(4)

  let txRunning = tx?.isRunning ?? false
  let submitEnabled: boolean =
    !txRunning
    && !amountError
    && !addressError
    && wallet !== null
    && sendToAddress !== null
    && (withdrawAll || !!withdrawAmount);

  return (
    <Container className="form-style">
      <label className="title">{S.withdrawFromBalance}</label>

      {/*Balance*/}
      <Row className="form-row">
        <Col>
          <label>{S.balance}</label>
        </Col>
        <Col>
          <div className="funds-1-pad">
            {potBalance ? potBalance.toFixedLocalized() : "..."}
          </div>
        </Col>
      </Row>

      {/* withdraw amount*/}
      <Row className="form-row">
        <Col>
          <label>{S.withdraw}<span
            className={errorClass(amountError)}> *</span></label>
        </Col>
        <Col>
          <input
            type="number"
            className="withdraw-amount editable"
            placeholder={(0).toFixedLocalized(2)}
            onChange={(e) => {
              let amount = parseFloatSafe(e.currentTarget.value);
              const valid = amount != null && amount > 0
                && (!potBalance || fundsToken?.fromNumber(amount).lte(potBalance));
              setUserEnteredWithdrawAmount(amount)
              setAmountError(!valid)
            }}
            value={editingWithdrawAmount ? undefined : withdrawAmount}
            onFocus={(e) => setEditingWithdrawAmount(true)}
            onBlur={(e) => setEditingWithdrawAmount(false)}
          />
        </Col>
      </Row>

      {/*target address (v0)*/}
      <Visibility visible={api.eth?.isV0 ?? true}>
        <Row>
          <Col>
            <label>{S.withdrawingTo}:<span
              className={errorClass(addressError)}> *</span></label>
            <input
              type="text"
              className="send-to-address editable"
              placeholder={S.address}
              onChange={(e) => {
                const address = e.currentTarget.value;
                const valid = isEthAddress(address);
                setSendToAddress(valid ? address : null)
                setAddressError(!valid)
              }}
            />
          </Col>
        </Row>
      </Visibility>

      {/*Withdraw all checkbox*/}
      <Row>
        <Col>
          <div className={pot?.isUnlocked ? "" : "disabled-faded"} style={{
            display: 'flex',
            alignItems: 'baseline',
          }}>
            <input
              type="checkbox"
              style={{transform: 'scale(2)', margin: '16px'}}
              onChange={(e) => {
                const value = e.currentTarget.checked;
                setWithdrawAll(value);
              }}
            />
            <label>{S.withdrawFullBalanceAndDeposit}</label>
          </div>
        </Col>
      </Row>

      <p className="instructions-narrow" style={{width: '75%'}}>{S.noteIfOverdraftOccurs}</p>
      <div style={{marginTop: '16px'}}>
        <SubmitButton onClick={() => submitWithdrawFunds().then()} enabled={submitEnabled}>
          {S.withdraw + " " + (fundsToken?.symbol ?? "Funds")}</SubmitButton>
      </div>

      <TransactionProgress ref={txResult} tx={tx}/>
    </Container>
  );
}

