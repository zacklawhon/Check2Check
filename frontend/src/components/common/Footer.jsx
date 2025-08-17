import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-gray-400 text-sm text-center p-4 mt-8">
            <div className="container mx-auto">
                <p>&copy; {currentYear} Check2Check. All Rights Reserved.</p>
                <div className="flex justify-center gap-4 mt-2">
                    <Link to="/terms" className="hover:text-white">Terms & Conditions</Link>
                    <span>|</span>
                    <Link to="/request-invite" className="hover:text-white">Request Beta Invite</Link>
                </div>
            </div>
        </footer>
    );
}

export default Footer;