import { FileStorageOption, FileStorageProviderEnum, UploadedFile } from '@gauzy/contracts';
import { isNotEmpty } from '@gauzy/common';
import * as multerS3 from 'multer-s3';
import { basename, join } from 'path';
import * as moment from 'moment';
import { environment } from '@gauzy/config';
import * as AWS from 'aws-sdk';
import { StorageEngine } from 'multer';
import { Provider } from './provider';
import { RequestContext } from '../../context';

export interface IS3Config {
	rootPath: string;
	aws_access_key_id: string;
	aws_secret_access_key: string;
	aws_default_region: string;
	aws_bucket: string;
}

export class S3Provider extends Provider<S3Provider> {

	static instance: S3Provider;
	name = FileStorageProviderEnum.S3;
	config: IS3Config;
	defaultConfig: IS3Config;

	constructor() {
		super();
		this.config = this.defaultConfig = {
			rootPath: '',
			aws_access_key_id: environment.awsConfig.accessKeyId,
			aws_secret_access_key: environment.awsConfig.secretAccessKey,
			aws_default_region: environment.awsConfig.region,
			aws_bucket: environment.awsConfig.s3.bucket
		};
	}

	getInstance() {
		if (!S3Provider.instance) {
			S3Provider.instance = new S3Provider();
		}
		this.setAwsDetails();
		return S3Provider.instance;
	}

	setAwsDetails() {
		const request = RequestContext.currentRequest();
		if (request) {
			const settings = request['tenantSettings'];
			if (
				settings &&
				settings.aws_access_key_id &&
				isNotEmpty(settings.aws_access_key_id.trim()) &&
				settings.aws_secret_access_key &&
				isNotEmpty(settings.aws_secret_access_key.trim())
			) {
				this.config = {
					...this.defaultConfig,
					aws_access_key_id: settings.aws_access_key_id,
					aws_secret_access_key: settings.aws_secret_access_key,
					aws_default_region: settings.aws_default_region,
					aws_bucket: settings.aws_bucket
				};
			}
		} else {
			this.config = {
				...this.defaultConfig
			};
		}
	}

	/**
	 * Get a pre-signed URL for a given operation name.
	 *
	 * @param key
	 * @returns
	*/
	url(key: string) {
		if (!key) {
			return null;
		}
		const url = this.getS3Instance().getSignedUrl('getObject', {
			Bucket: this.getS3Bucket(),
			Key: key,
			Expires: 3600
		});
		return url;
	}

	/**
	 * Get full Path of the file storage
	 *
	 * @param filePath
	 * @returns
	 */
	path(filePath: string) {
		return filePath ? join(this.config.rootPath, filePath) : null;
	}

	handler({ dest, filename, prefix }: FileStorageOption): StorageEngine {
		return multerS3({
			s3: this.getS3Instance(),
			bucket: this.getS3Bucket(),
			metadata: function (_req, file, cb) {
				cb(null, { fieldName: file.fieldname });
			},
			key: (_req, file, callback) => {
				// A string or function that determines the destination path for uploaded
				const dir = dest instanceof Function ? dest(file) : dest;

				// A file extension, or filename extension, is a suffix at the end of a file.
				const extension = file.originalname.split('.').pop();

				// A function that determines the name of the uploaded file.
				let fileName: string;
				if (filename) {
					fileName = (typeof filename === 'string') ? filename : filename(file, extension);
				} else {
					fileName = `${prefix}-${moment().unix()}-${parseInt('' + Math.random() * 1000, 10)}.${extension}`;
				}

				const fullPath = join(this.config.rootPath, dir, fileName);
				callback(null, fullPath);
			}
		});
	}

	async getFile(key: string): Promise<Buffer> {
		const s3 = this.getS3Instance();
		const params = {
			Bucket: this.getS3Bucket(),
			Key: key
		};

		const data = await s3.getObject(params).promise();
		return data.Body as Buffer;
	}

	async putFile(fileContent: string, key: string = ''): Promise<any> {
		return new Promise((putFileResolve, reject) => {
			const fileName = basename(key);
			const s3 = this.getS3Instance();
			const params = {
				Bucket: this.getS3Bucket(),
				Body: fileContent,
				Key: key,
				ContentDisposition: `inline; ${fileName}`
			};

			s3.putObject(params, async (err) => {
				if (err) {
					reject(err);
				} else {
					const size = await s3
						.headObject({ Key: key, Bucket: this.getS3Bucket() })
						.promise()
						.then((res) => res.ContentLength);

					const file = {
						originalname: fileName, // original file name
						size: size, // files in bytes
						filename: fileName,
						path: key, // Full path of the file
						key: key // Full path of the file
					};
					putFileResolve(this.mapUploadedFile(file));
				}
			});
		});
	}

	deleteFile(key: string): Promise<void> {
		const s3 = this.getS3Instance();
		const params = {
			Bucket: this.getS3Bucket(),
			Key: key
		};
		return new Promise((deleteFileResolve, reject) => {
			s3.deleteObject(params, function (err) {
				if (err) reject(err);
				else deleteFileResolve();
			});
		});
	}

	private getS3Instance() {
		this.setAwsDetails();
		return new AWS.S3({
			accessKeyId: this.config.aws_access_key_id,
			secretAccessKey: this.config.aws_secret_access_key,
			region: this.config.aws_default_region
		});
	}

	getS3Bucket() {
		this.setAwsDetails();
		return this.config.aws_bucket;
	}

	mapUploadedFile(file): UploadedFile {
		file.filename = file.originalname;
		file.url = this.url(file.key); // file.location;
		return file;
	}
}
