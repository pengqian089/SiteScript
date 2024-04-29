<template>
  <pre>
    <code class="language-csharp">
public async Task&lt;object?&gt; RefreshTokenAsync(string accessToken, string refreshToken, TokenPlatform platform)
{
    var tokenValidationParameters = new TokenValidationParameters
    {
        ValidIssuer = _tokenManagement.Issuer,
        ValidAudience = _tokenManagement.Audience,
        ValidateIssuer = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_tokenManagement.Secret)),
        // 忽略token过期时间，验证token
        ValidateLifetime = false
    };
    var principal =
        new JwtSecurityTokenHandler().ValidateToken(accessToken, tokenValidationParameters,
            out var securityToken);
    if (principal.Identity?.IsAuthenticated != true ||
        securityToken is not JwtSecurityToken jwtSecurityToken ||
        !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256,
            StringComparison.InvariantCultureIgnoreCase)
       )
    {
        _logger.LogError("refresh token fail,stack trace:{StackTrace}", Environment.StackTrace);
        return null;
    }

    var account = principal.Identity?.Name ?? "";
    if (await _accountTokenService.ValidateRefreshTokenAsync(account, refreshToken, platform))
    {
        var userInfo = await _accountService.GetOneUserAsync(account);
        if (!userInfo.Avatar.StartsWith("http", StringComparison.CurrentCultureIgnoreCase))
        {
            userInfo.Avatar = _configuration["WebHost"] + userInfo.Avatar;
        }

        var newAccessToken = GenerateAccessToken(userInfo);
        var newRefreshToken = await _accountTokenService.GenerateRefreshTokenAsync(account,
            DateTime.Now.AddDays(_tokenManagement.RefreshExpiration), platform);
        return new
        {
            newAccessToken.expires, newAccessToken.token, refreshToken = newRefreshToken, account = userInfo
        };
    }

    return null;
}
    </code>
  </pre>
</template>

<script>
import { defineComponent } from 'vue';
import Prism from "prismjs";

export default defineComponent({
  name: 'IndexPage',
  updated() {
    Prism.highlightAll();
  }
});
</script>
