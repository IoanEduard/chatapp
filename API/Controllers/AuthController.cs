using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using API.Models.Contracts;
using API.Models.DTO;
using API.Models.Entities;
using AutoMapper;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace API.Controllers
{
    [EnableCors("CorsPolicy")] 
    [ApiController]
    [Route("[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IConfiguration _config;
        private readonly IMapper _mapper;
        private readonly ITokenService _tokenService;

        public AuthController(IAuthService authService, IConfiguration config, IMapper mapper, ITokenService tokenService)
        {
            this._authService = authService;
            this._config = config;
            _mapper = mapper;
            this._tokenService = tokenService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(UserRegisterDto userForRegisterDto)
        {
            // Validate request

            userForRegisterDto.Username = userForRegisterDto.Username.ToLower();

            if (await _authService.UserExists(userForRegisterDto.Username))
                return BadRequest("Username already exists");

            var newUser = new User
            {
                Username = userForRegisterDto.Username,
                Email = userForRegisterDto.Email,
                UserProfile = new UserProfile {
                    Name = userForRegisterDto.Name,
                    PhotoUrl = userForRegisterDto.PhotoUrl,
                    PublicId = userForRegisterDto.PublicId
                }
            };

            var createdUser = await _authService.Register(newUser, userForRegisterDto.Password);

            return Ok(new
            {
                token = await _tokenService.CreateToken(createdUser),
                userId = createdUser.Id
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(UserLoginDto userForLoginDto)
        {
            var user = await _authService.Login(userForLoginDto.Username, userForLoginDto.Password);

            if (user == null)
                return Unauthorized();

            return Ok(new
            {
                token = await _tokenService.CreateToken(user),
                userProfile = new UserProfile {
                    Id = user.UserProfile.Id,
                    Name = user.UserProfile.Name,
                    PublicId = user.UserProfile.PublicId,
                    PhotoUrl = user.UserProfile.PhotoUrl
                }
            });
        }
    }
}