import { Module } from '@nestjs/common';
import { TbankService } from './tbank.service';

@Module({
  providers: [TbankService],
  exports: [TbankService]
})
export class TbankModule {}
