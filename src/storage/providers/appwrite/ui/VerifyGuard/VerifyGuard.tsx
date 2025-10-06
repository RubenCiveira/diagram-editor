import { account } from "../../AppwriteConnector";

type Props = { onSuccess: () => void }

export default function VerifyGuard({ onSuccess }: Props) {
    const sendVerification = function() {
        const location = window.location.origin + window.location.pathname + '?on=verify';
        account.createVerification({ url: location });
    }

    return <div>
            <h1>Hay que verificar el email</h1>
            <button onClick={sendVerification}>Reenviar</button>
            <button className="social-btn github-btn" onClick={() => {onSuccess()}}>Verify</button>
        </div>;
}