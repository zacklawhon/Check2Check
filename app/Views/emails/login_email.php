<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Login Link</title>
</head>

<body style="margin: 0; padding: 0; font-family: sans-serif; background-color: #f4f4f4;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="600"
        style="border-collapse: collapse; margin-top: 20px; background-color: #ffffff;">
        <tr>
            <td align="center" bgcolor="#4f46e5" style="padding: 40px 0;">
                <h1 style="color: #ffffff; margin: 0;">Your Login Link</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px 30px;">
                <p style="color: #333333;">Hello,</p>
                <p style="color: #333333;">Click the button below to log in securely. This link will expire in 15
                    minutes.</p>
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td align="center" style="padding: 20px 0;">
                            <a href="<?= $magicLink ?>"
                                style="background-color: #4f46e5; color: #ffffff; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Log
                                In Now</a>
                        </td>
                    </tr>
                </table>

                <?php if (isset($snapshotData)): ?>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%"
                        style="background-color: #f9f9f9; border: 1px solid #dddddd; margin-top: 20px;">
                        <tr>
                            <td style="padding: 20px;">
                                <h3 style="margin: 0 0 10px 0; color: #333333;"><?= $snapshotData['title'] ?></h3>
                                <p style="margin: 0; color: #333333;"><?= $snapshotData['message'] ?></p>
                            </td>
                        </tr>
                    </table>
                <?php endif; ?>

                <p style="color: #333333; margin-top: 30px;">If you didn't request this, you can safely ignore this
                    email.</p>
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