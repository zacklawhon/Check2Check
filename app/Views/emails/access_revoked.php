<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Your Shared Access Has Been Updated</title>
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
            <h1>Shared Access Update</h1>
        </div>
        <div class="content">
            <p>Hi there,</p>
            <p>This is a notification that your shared access to the Check2Check budget of <strong><?= esc($ownerName) ?></strong> has been revoked.</p>
            
            <p>Your account has not been deleted. It has been converted back into a standard, independent account. You can now log in to set up and manage your own personal budget.</p>

            <a href="<?= site_url('login') ?>" class="button">Log In to Your Account</a>

            <p>Thanks,<br>The Check2Check Team</p>
        </div>
        <div class="footer">
            <p>If you have questions about this change, please contact the budget owner directly.</p>
        </div>
    </div>
</body>
</html>