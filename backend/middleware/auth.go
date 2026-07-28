package middleware

import (
	"kupola-app-backend/config"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(401, gin.H{"success": false, "message": "未授权"})
			c.Abort()
			return
		}

		tokenParts := strings.Fields(authHeader)
		if len(tokenParts) != 2 || !strings.EqualFold(tokenParts[0], "Bearer") {
			c.JSON(401, gin.H{"success": false, "message": "token格式错误"})
			c.Abort()
			return
		}

		tokenString := tokenParts[1]

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if token.Method != jwt.SigningMethodHS256 {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(cfg.JWTSecret), nil
		}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))

		if err != nil {
			c.JSON(401, gin.H{"success": false, "message": "token无效"})
			c.Abort()
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			userID, userIDOK := claims["user_id"].(float64)
			username, usernameOK := claims["username"].(string)
			if !userIDOK || !usernameOK || userID <= 0 || strings.TrimSpace(username) == "" {
				c.JSON(401, gin.H{"success": false, "message": "token无效"})
				c.Abort()
				return
			}
			c.Set("user_id", int(userID))
			c.Set("username", username)
			c.Next()
		} else {
			c.JSON(401, gin.H{"success": false, "message": "token无效"})
			c.Abort()
		}
	}
}
