// Copyright (c) 2019-2020 Ever Co. LTD

// Modified code from https://github.com/xmlking/ngx-starter-kit.
// Originally MIT Licensed
// - see https://github.com/xmlking/ngx-starter-kit/blob/develop/LICENSE
// - original code `Copyright (c) 2018 Sumanth Chinthagunta`

import { Invoice } from '../invoices';
import { InvoiceItem } from '../invoice-item';
import { Tag } from '../tags';
import { NestModule, Module, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '../config';
import { environment as env } from '@env-api/environment';
import { User } from '../user';
import { Employee } from '../employee';
import { Role } from '../role';
import { Organization } from '../organization';
import { Income } from '../income';
import { Expense } from '../expense';
import { EmployeeSetting } from '../employee-setting';
import { RequestContextMiddleware } from './context';
import { UserOrganization } from '../user-organization';
import { OrganizationDepartment } from '../organization-department';
import { OrganizationRecurringExpense } from '../organization-recurring-expense';
import { EmployeeRecurringExpense } from '../employee-recurring-expense';
import { OrganizationClients } from '../organization-clients';
import { OrganizationPositions } from '../organization-positions';
import { OrganizationVendors } from '../organization-vendors';
import { OrganizationProjects } from '../organization-projects';
import { OrganizationTeams } from '../organization-teams';
import { Proposal } from '../proposal';
import { Country } from '../country';
import { Invite } from '../invite';
import { Email } from '../email';
import { TimeOffPolicy } from '../time-off-policy';
import { RolePermissions } from '../role-permissions';
import { Tenant } from './../tenant/tenant.entity';
import { EmailTemplate } from '../email-template';
import { OrganizationEmploymentType } from '../organization-employment-type';
import { Equipment } from '../equipment';
import { EmployeeLevel } from '../organization_employeeLevel/organization-employee-level.entity';
import { Task } from '../tasks';
import {
	TimeSlot,
	Timesheet,
	TimeLog,
	Activity,
	Screenshot
} from '../timesheet';
import { ExpenseCategory } from '../expense-categories';
import { EquipmentSharing } from '../equipment-sharing';

const entities = [
	Invite,
	User,
	Employee,
	Role,
	Organization,
	Income,
	Expense,
	EmployeeSetting,
	UserOrganization,
	OrganizationDepartment,
	OrganizationClients,
	OrganizationPositions,
	OrganizationProjects,
	OrganizationVendors,
	OrganizationRecurringExpense,
	EmployeeRecurringExpense,
	OrganizationTeams,
	Proposal,
	Country,
	Email,
	TimeOffPolicy,
	RolePermissions,
	Tenant,
	EmailTemplate,
	Tag,
	Invoice,
	InvoiceItem,
	OrganizationEmploymentType,
	Equipment,
	EquipmentSharing,
	EmployeeLevel,
	Task,
	TimeSlot,
	Timesheet,
	TimeLog,
	Activity,
	Screenshot,
	ExpenseCategory
];

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
				...env.database,
				entities
				// subscribers,
				// migrations,
			}),
			inject: [ConfigService]
		})
		/*
    TerminusModule.forRootAsync({
      // Inject the TypeOrmHealthIndicator provided by nestjs/terminus
      inject: [TypeOrmHealthIndicator, DNSHealthIndicator],
      useFactory: (db, dns) => getTerminusOptions(db, dns)
    })
    */
	],
	controllers: [],
	providers: []
})
export class CoreModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(RequestContextMiddleware).forRoutes('*');
	}
}
