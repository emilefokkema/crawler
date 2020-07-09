using System;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Crawler.Results;

namespace Crawler
{
    public class Client: IClient
    {
        private readonly HttpClient _httpClient;
        private readonly IColoredLineWriter _coloredLineWriter;
        public Client(HttpClient httpClient, IColoredLineWriter coloredLineWriter)
        {
            _httpClient = httpClient;
            _coloredLineWriter = coloredLineWriter;
        }

        public async Task<Result> Get(Uri url)
        {
            _coloredLineWriter.WriteLine($"Going to get {url}", ConsoleColor.Yellow);
            var request = new HttpRequestMessage();
            request.RequestUri = url;
            request.Method = HttpMethod.Get;
            try
            {
                var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);
                return await HandleResponse(url, response);
            }
            catch (Exception e)
            {
                return new ErrorResult(e);
            }
        }

        private async Task<Result> HandleResponse(Uri url, HttpResponseMessage response)
        {
            if (response.StatusCode == HttpStatusCode.Redirect)
            {
                return new RedirectResult(url, response.Headers.Location);
            }

            if (!response.IsSuccessStatusCode)
            {
                return new ErrorResult($"status code was {response.StatusCode}");
            }

            var content = response.Content;
            var contentAsString = await content.ReadAsStringAsync();
            return new SuccessResult(url, contentAsString);
        }
    }
}
