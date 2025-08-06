<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Check2Check.org</title>
</head>

<body style="margin: 0; padding: 0; font-family: sans-serif; background-color: #f4f4f4;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="600"
        style="border-collapse: collapse; margin-top: 20px; background-color: #ffffff;">
        <tr>
            <td align="center" bgcolor="#4f46e5" style="padding: 40px 0;">
                <h1 style="color: #ffffff; margin: 0;">Welcome to Check2Check.org!</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px 30px;">
                <p style="color: #333333;">Hello,</p>
                <p style="color: #333333;">We're excited to help you take control of your finances. Click the button
                    below to log in securely. This link will expire in 15 minutes.</p>
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td align="center" style="padding: 20px 0;">
                            <a href="<?= $magicLink ?>"
                                style="background-color: #4f46e5; color: #ffffff; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Log
                                In Now</a>
                        </td>
                    </tr>
                </table>
                <h3 style="color: #333333; border-bottom: 1px solid #dddddd; padding-bottom: 10px;">Key Features:</h3>
                <ul style="color: #333333; line-height: 1.6;">
                    <li><b>Smart Wizard:</b> Get intelligent suggestions to set up your budget in minutes.</li>
                    <li><b>Interactive Budgeting:</b> Track income, pay bills, and manage spending all in one place.
                    </li>
                    <li><b>Category-Specific Details:</b> Track loan balances and credit card debt with specialized
                        tools.</li>
                </ul>
                <p style="color: #333333;">If you didn't request this, you can safely ignore this email.</p>
            </td>
        </tr>
        <tr>
            <td bgcolor="#eeeeee" style="padding: 30px; text-align: center; color: #666666; font-size: 12px;">
                &copy; <?= date('Y') ?> Check2Check.org. All rights reserved.
            </td>
        </tr>
    </table>
</body>

</html>