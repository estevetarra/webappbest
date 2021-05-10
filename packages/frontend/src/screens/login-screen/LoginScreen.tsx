import React, { FunctionComponent, useState } from 'react';
import GoogleLogin from 'react-google-login';
import { Redirect } from 'react-router-dom';
import logo from '../../assets/BEST_LOGO.svg';
import { CustomModal } from '../../components/custom-modal/CustomModal';
import './LoginScreen.css';

export const LoginScreen: FunctionComponent = () => {
    const [loggedIn, setLoggedIn] = useState<boolean>(false);
    const [modalShown, setModalShown] = useState<boolean>(false);

    function handleModal() {
        setModalShown(!modalShown);
    }
    return loggedIn ? (
        <Redirect to="/"></Redirect>
    ) : (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <GoogleLogin
                    clientId={process.env.REACT_APP_CLIENT_ID!}
                    buttonText="Log in with Google"
                    onSuccess={(response) => {
                        console.log(response);
                        setLoggedIn(true);
                    }}
                    onFailure={(e) => {
                        handleModal();
                    }}
                    cookiePolicy={'single_host_origin'}
                />
                <CustomModal
                    title="Error"
                    body="Could not be logged in!"
                    modalHandler={handleModal}
                    show={modalShown}
                ></CustomModal>
            </header>
        </div>
    );
};
