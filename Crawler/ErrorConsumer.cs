using System;

namespace Crawler
{
    public class ErrorConsumer: IResultConsumer
    {
        private readonly IColoredLineWriter _coloredLineWriter;

        public ErrorConsumer(IColoredLineWriter coloredLineWriter)
        {
            _coloredLineWriter = coloredLineWriter;
        }

        public void Consume(Result result)
        {
            if (!(result is ErrorResult error))
            {
                return;
            }
            _coloredLineWriter.WriteLine(error.Message, ConsoleColor.Red);
        }
    }
}
