<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>You've been invited to Check2Check!</title>
    <style>
        body { font-family: sans-serif; background-color: #f4f4f4; color: #333; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 1px solid #eeeeee; padding-bottom: 20px; margin-bottom: 20px; }
        .content p { line-height: 1.6; }
        .button { display: block; width: fit-content; margin: 30px auto; padding: 15px 25px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>You're Invited!</h1>
        </div>
        <div class="content">
            <p>Hi there,</p>
            <p>Your friend (<?= esc($inviterEmail) ?>) is using <strong>Check2Check</strong> to manage their finances and thought you'd love it too.</p>
            
            <p><?= esc($pitchMessage) ?></p>

            <a href="<?= esc($inviteLink) ?>" class="button">Get Started Now</a>

            <p>If you have any questions, just reply to this email.</p>
            <p>Thanks,<br>The Check2Check Team</p>
        </div>
        <div class="footer">
            <p>If you received this email by mistake, please disregard it.</p>
        </div>
    </div>
</body>
</html>