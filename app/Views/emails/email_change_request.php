<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Your Email Change</title>
</head>

<body style="margin: 0; padding: 0; font-family: sans-serif; background-color: #f4f4f4;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="600"
        style="border-collapse: collapse; margin-top: 20px; background-color: #ffffff; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
        <tr>
            <td align="center" bgcolor="#4f46e5" style="padding: 40px 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Confirm Your Email Change</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px 30px;">
                <h2 style="color: #333333;">Hello,</h2>
                <p style="color: #555555; line-height: 1.6;">You recently requested to change the email address
                    associated with your Check2Check.org account.</p>

                <p style="color: #555555; line-height: 1.6;">You requested to change your email to:</p>
                <p
                    style="text-align: center; font-size: 18px; font-weight: bold; color: #333333; background-color: #f0f0f0; padding: 10px; border-radius: 5px; margin: 20px 0;">
                    <?= esc($newEmail) ?></p>

                <p style="color: #555555; line-height: 1.6;">To complete the process, please click the button below. For
                    your security, this link will expire in 15 minutes.</p>

                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
                    <tr>
                        <td align="center">
                            <a href="<?= $verificationLink ?>"
                                style="background-color: #4f46e5; color: #ffffff; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                Confirm Email Change
                            </a>
                        </td>
                    </tr>
                </table>

                <p style="color: #555555; line-height: 1.6;">If you did not request this change, you can safely ignore
                    this email. Your account will remain secure.</p>
                <p style="color: #555555; line-height: 1.6;">If you're having trouble with the button, you can also copy
                    and paste this link into your browser:<br>
                    <a href="<?= $verificationLink ?>"
                        style="color: #4f46e5; text-decoration: underline;"><?= $verificationLink ?></a>
                </p>
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