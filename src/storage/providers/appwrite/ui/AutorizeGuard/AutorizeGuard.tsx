
type Props = { onSuccess: () => void }

export default function AutorizeGuard({ onSuccess }: Props) {

    return <div>
            <h1>Su cuenta aun no está autorizada.</h1>
            <p>Pruebe a contactar con rubenciveira@gmail.com para acelerar la autenticación.</p>
            <button className="social-btn github-btn" onClick={() => {onSuccess()}}>Verify</button>
        </div>;
}