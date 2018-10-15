#define WINDOWSIZE 54   
#define FS 360          
#define BUFFSIZE 600    

#include <stdio.h>   
int main()
{
	__int64 signal[BUFFSIZE], dcblock[BUFFSIZE], lowpass[BUFFSIZE], highpass[BUFFSIZE], derivative[BUFFSIZE], squared[BUFFSIZE], integral[BUFFSIZE];
	__int64 rr1[8], rr2[8], rravg1, rravg2, rrlow = 0, rrhigh = 0, rrmiss = 0;
	__int64 i, j, sample = 0, lastQRS = 0, lastSlope = 0;
	__int64 current;
	__int64 peak_i = 0, peak_f = 0, threshold_i1 = 0, threshold_i2 = 0, threshold_f1 = 0, threshold_f2 = 0, spk_i = 0, spk_f = 0, npk_i = 0, npk_f = 0;

	FILE *fin, *fout;
	fin = fopen("ecg data.txt", "r");
	fout = fopen("test.txt", "w+");

	bool qrs, regular = true, prevRegular;

	for (i = 0; i < 8; i++)
	{
		rr1[i] = 0;
		rr2[i] = 0;
	}
	while(1) {
		if (sample >= BUFFSIZE)

		{
			for (i = 0; i < BUFFSIZE - 1; i++)
			{
				signal[i] = signal[i + 1];
				dcblock[i] = dcblock[i + 1];
				lowpass[i] = lowpass[i + 1];
				highpass[i] = highpass[i + 1];
				derivative[i] = derivative[i + 1];
				squared[i] = squared[i + 1];
				integral[i] = integral[i + 1];
			}
			current = 499;
		}
		else
		{
			current = sample;
		}
		signal[current] = -100000;
		fscanf(fin, "%d", &signal[current]);
		if (signal[current] == -100000)
			break;
		sample++;

		qrs = false;

		if (current >= 1)
			dcblock[current] = signal[current] - signal[current - 1] + 0.995*dcblock[current - 1];
		else
			dcblock[current] = 0;

		lowpass[current] = dcblock[current];
		if (current >= 1)
			lowpass[current] += 2 * lowpass[current - 1];
		if (current >= 2)
			lowpass[current] -= lowpass[current - 2];
		if (current >= 6)
			lowpass[current] -= 2 * dcblock[current - 6];
		if (current >= 12)
			lowpass[current] += dcblock[current - 12];

		highpass[current] = -lowpass[current];
		if (current >= 1)
			highpass[current] -= highpass[current - 1];
		if (current >= 16)
			highpass[current] += 32 * lowpass[current - 16];
		if (current >= 32)
			highpass[current] += lowpass[current - 32];

		derivative[current] = highpass[current];
		if (current > 0)
			derivative[current] -= highpass[current - 1];

		squared[current] = derivative[current] * derivative[current];

		integral[current] = 0;
		for (i = 0; i < WINDOWSIZE; i++)
		{
			if (current >= i)
				integral[current] += integral[current - i];
			else
				break;
		}
		integral[current] /= i;
		if (integral[current] >= threshold_i1 || highpass[current] >= threshold_f1)
		{
			peak_i = integral[current];
			peak_f = highpass[current];
		}
		
		if ((integral[current] >= threshold_i1) && (highpass[current] >= threshold_f1)) // integral[current]
		{
			if (sample > lastQRS + 0.2*FS)
			{
				if (sample <= lastQRS + 0.36*FS)
				{
					if (squared[current] < lastSlope / 2)
					{
						qrs = false;
					}

					else
					{
						spk_i = 0.125*peak_i + 0.875*spk_i;
						threshold_i1 = npk_i + 0.25*(spk_i - npk_i);
						threshold_i2 = 0.5*threshold_i1;

						spk_f = 0.125*peak_f + 0.875*spk_f;
						threshold_f1 = npk_f + 0.25*(spk_f - npk_f);
						threshold_f2 = 0.5*threshold_f1;

						lastSlope = squared[current];
						qrs = true;
					}
				}
				else
				{
					if (squared[current] > lastSlope / 2)
					{
						spk_i = 0.125*peak_i + 0.875*spk_i;
						threshold_i1 = npk_i + 0.25*(spk_i - npk_i);
						threshold_i2 = 0.5*threshold_i1;

						spk_f = 0.125*peak_f + 0.875*spk_f;
						threshold_f1 = npk_f + 0.25*(spk_f - npk_f);
						threshold_f2 = 0.5*threshold_f1;

						lastSlope = squared[current];
						qrs = true;
					}
				}
			}
			else
			{
				peak_i = integral[current];
				npk_i = 0.125*peak_i + 0.875*npk_i;
				threshold_i1 = npk_i + 0.25*(spk_i - npk_i);
				threshold_i2 = 0.5*threshold_i1;
				peak_f = highpass[current];
				npk_f = 0.125*peak_f + 0.875*npk_f;
				threshold_f1 = npk_f + 0.25*(spk_f - npk_f);
				threshold_f2 = 0.5*threshold_f1;
				qrs = false;
				fprintf(fout, "%I64d %I64d %I64d %I64d %I64d %d\n", lowpass[current], highpass[current], derivative[current], squared[current], integral[current], qrs);
				continue;
			}

		}

		if (qrs)
		{
			rravg1 = 0;
			for (i = 0; i < 7; i++)
			{
				rr1[i] = rr1[i + 1];
				rravg1 += rr1[i];
			}
			rr1[7] = sample - lastQRS;
			lastQRS = sample;
			rravg1 += rr1[7];
			rravg1 *= 0.125;

			if ((rr1[7] >= rrlow) && (rr1[7] <= rrhigh))
			{
				rravg2 = 0;
				for (i = 0; i < 7; i++)
				{
					rr2[i] = rr2[i + 1];
					rravg2 += rr2[i];
				}
				rr2[7] = rr1[7];
				rravg2 += rr2[7];
				rravg2 *= 0.125;
				rrlow = 0.92*rravg2;
				rrhigh = 1.16*rravg2;
				rrmiss = 1.66*rravg2;
			}

			prevRegular = regular;
			if (rravg1 == rravg2)
			{
				regular = true;
			}
			else
			{
				regular = false;
				if (prevRegular)
				{
					threshold_i1 /= 2;
					threshold_f1 /= 2;
				}
			}
		}
		else
		{
			if (sample - lastQRS > rrmiss)
			{
				for (i = current - (sample - lastQRS); i < current; i++)
				{
					if ((integral[current] > threshold_i2) && (highpass[i] > threshold_f2)) //integral[current]
					{
						peak_i = integral[i];
						peak_f = highpass[i];
						spk_i = 0.25*peak_i + 0.75*spk_i;
						spk_f = 0.25*peak_f + 0.75*spk_f;
						threshold_i1 = npk_i + 0.25*(spk_i - npk_i);
						threshold_i2 = 0.5*threshold_i1;
						lastSlope = squared[i];
						threshold_f1 = npk_f + 0.25*(spk_f - npk_f);
						threshold_f2 = 0.5*threshold_f1;
						qrs = true;
						break;
					}
				}
			}
			if (!qrs)
			{
				if ((integral[current] >= threshold_i1) || (highpass[current] >= threshold_f1)) //integral[current]
				{
					peak_i = integral[current];
					npk_i = 0.125*peak_i + 0.875*npk_i;
					threshold_i1 = npk_i + 0.25*(spk_i - npk_i);
					threshold_i2 = 0.5*threshold_i1;
					peak_f = highpass[current];
					npk_f = 0.125*peak_f + 0.875*npk_f;
					threshold_f1 = npk_f + 0.25*(spk_f - npk_f);
					threshold_f2 = 0.5*threshold_f1;
				}
			}
			else
			{
				//RR Average 1
				rravg1 = 0;
				for (j = 0; j < 7; j++)
				{
					rr1[j] = rr1[j + 1];
					rravg1 += rr1[j];
				}
				rr1[7] = sample - i - lastQRS;
				lastQRS = sample - i;
				rravg1 += rr1[7];
				rravg1 *= 0.125;

				//RR Average 2
				if ((rr1[7] >= rrlow) && (rr1[7] <= rrhigh))
				{
					rravg2 = 0;
					for (i = 0; i < 7; i++)
					{
						rr2[i] = rr2[i + 1];
						rravg2 += rr2[i];
					}
					rr2[7] = rr1[7];
					rravg2 += rr2[7];
					rravg2 *= 0.125;
					rrlow = 0.92*rravg2;
					rrhigh = 1.16*rravg2;
					rrmiss = 1.66*rravg2;
				}

				prevRegular = regular;
				if (rravg1 == rravg2)
				{
					regular = true;
				}
				else
				{
					regular = false;
					if (prevRegular)
					{
						threshold_i1 /= 2;
						threshold_f1 /= 2;
					}
				}
			}
		}
		fprintf(fout, "%I64d %I64d %I64d %I64d %I64d %d\n", lowpass[current], highpass[current], derivative[current], squared[current], integral[current], qrs);
	}
	fclose(fin);
	fclose(fout);
}
