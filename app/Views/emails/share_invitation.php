<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invitation to Share a Budget</title>
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
            <h1>Invitation to Share a Budget</h1>
        </div>
        <div class="content">
            <p>Hi there,</p>
            <p>You've received an invitation from <strong><?= esc($ownerName) ?></strong> to access and collaborate on their Check2Check budget.</p>
            
            <p>Sharing a budget can help with managing household finances, tracking shared expenses, or working towards common financial goals.</p>

            <a href="<?= esc($inviteLink) ?>" class="button">Accept Invitation</a>

            <p>If you have any questions, please contact the person who invited you directly.</p>
            <p>Thanks,<br>The Check2Check Team</p>
        </div>
        <div class="footer">
            <p>If you received this email by mistake, please disregard it.</p>
        </div>
    </div>
</body>
</html>