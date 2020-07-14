using System;
using System.Threading;
using System.Threading.Tasks;

namespace Crawler.Logging
{
    public class ColoredLineWriter: IColoredLineWriter
    {
        private readonly Semaphore _semaphore;
        public ColoredLineWriter()
        {
            _semaphore = new Semaphore(1, 1);
        }

        public void WriteLine(string line, ConsoleColor color)
        {
            Task.Run(() =>
            {
                _semaphore.WaitOne();
                ConsoleColor oldColor = Console.ForegroundColor;
                Console.ForegroundColor = color;
                Console.WriteLine(line);
                Console.ForegroundColor = oldColor;
                _semaphore.Release();
            });
        }
    }
}
