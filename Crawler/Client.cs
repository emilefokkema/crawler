using System;
using System.Net.Http;
using System.Threading.Tasks;

namespace Crawler
{
    public class Client: IClient
    {
        private readonly HttpClient _httpClient;
        public Client(HttpClient httpClient)
        {
            _httpClient = httpClient;
            
        }

        public async Task<Result> Get(string url)
        {
            Console.WriteLine($"Going to get {url}");
            var request = new HttpRequestMessage();
            request.RequestUri = new Uri(url);
            request.Method = HttpMethod.Get;
            try
            {
                var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);
                return await HandleResponse(response);
            }
            catch (Exception e)
            {
                return new ErrorResult(e);
            }
        }

        private async Task<Result> HandleResponse(HttpResponseMessage response)
        {
            if (!response.IsSuccessStatusCode)
            {
                return new ErrorResult($"status code was ${response.StatusCode}");
            }

            var content = response.Content;
            var contentAsString = await content.ReadAsStringAsync();
            return new SuccessResult(contentAsString);
        }
    }
}
