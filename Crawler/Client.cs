using System;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Crawler.Logging;
using Crawler.Results;

namespace Crawler
{
    public class Client: IClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger _logger;
        public Client(HttpClient httpClient, ILogger logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<Result> Get(Uri url)
        {
            _logger.LogInfo($"Going to get {url}");
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
                return new ErrorResult($"Could not get {url}: ", e);
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
                return new ErrorResult($"status code for {url} was {response.StatusCode}");
            }

            var content = response.Content;
            var contentAsString = await content.ReadAsStringAsync();
            return new SuccessResult(url, contentAsString);
        }
    }
}
