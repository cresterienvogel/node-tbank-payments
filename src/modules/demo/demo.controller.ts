import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/auth/public.decorator';

@ApiTags('demo')
@Controller('/v1/demo')
export class DemoController {
  @Public()
  @Post('/callback-receiver')
  async receive(@Headers('x-signature') sig: string | undefined, @Body() body: any) {
    return { ok: true, received: true, signature: sig ?? null, body };
  }
}
