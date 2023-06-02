// spec is here: https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html
const arn =
  /^arn:(?<Partition>aws|aws-cn|aws-us-gov):(?<Service>[^:\n]+):(?<Region>[^:\n]*):(?<AccountID>\d*):(?<Resource>([^:/*]+([:/].*[^:/]+)?))$/iu;

export const isArnFormatValid = (taskResource: string): boolean => {
  return arn.test(taskResource);
};
